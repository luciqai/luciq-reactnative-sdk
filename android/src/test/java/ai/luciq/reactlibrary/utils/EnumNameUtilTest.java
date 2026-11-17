package ai.luciq.reactlibrary.utils;

import org.junit.Test;

import ai.luciq.bug.customreport.FieldError;
import ai.luciq.bug.customreport.NotSentReason;

import static org.junit.Assert.assertEquals;

public class EnumNameUtilTest {

    @Test
    public void toLowerCamel_convertsUpperSnakeNames() {
        assertEquals("bug", EnumNameUtil.toLowerCamel("BUG"));
        assertEquals("tryLater", EnumNameUtil.toLowerCamel("TRY_LATER"));
        assertEquals("extendedField", EnumNameUtil.toLowerCamel("EXTENDED_FIELD"));
        assertEquals("tooShort", EnumNameUtil.toLowerCamel("TOO_SHORT"));
        assertEquals("checkedByDefault", EnumNameUtil.toLowerCamel("CHECKED_BY_DEFAULT"));
    }

    @Test
    public void toLowerCamel_acceptsEnumValues() {
        assertEquals("duplicate", EnumNameUtil.toLowerCamel(NotSentReason.DUPLICATE));
        assertEquals("tooLong", EnumNameUtil.toLowerCamel(FieldError.Problem.TOO_LONG));
    }
}
